import {
  betterHTTPErrorReporting,
  defaultAccessToken,
  DODomain,
} from "../util";

import DigitalOcean from "do-wrapper";
import { DomainRecordRequestOptions } from "do-wrapper/dist/types/domain";
import yargs, { CommandModule, Arguments } from "yargs";

import fs from "fs";

//--

export default {
  command: "upload",
  describe: "Creates a new domain given a *.do-dns.json file",
  handler: uploadCmd,
  builder: {
    file: {
      description: "Path to input *.do-dns.json file",
      type: "string",
      demand: true,
      requiresArg: true,
    },
  },
} as CommandModule;

type UploadArgs = Arguments & {
  file: string;
};

type DomainRecordRequestOptionsWithID = DomainRecordRequestOptions & {
  id: string; // Inexplicitly missing from DomainRecordRequestOptions.
};

async function uploadCmd(args: Arguments) {
  //
  // Read the file.
  //

  const { file: inputFilePath } = args as UploadArgs;
  const domain: DODomain = JSON.parse(fs.readFileSync(inputFilePath, "utf-8"));

  const ipAddressResourceRecord = domain.records.find(
    (rr) => rr.type === "A" && rr.name === "@"
  );
  if (ipAddressResourceRecord === undefined) {
    throw new Error(`File missing IP Address ("A" record)`);
  }

  // Fix-up certain records to end with dots (DOc doesn't generate or emit ending dots, but requires them for creation).
  domain.records = domain.records.map((rr) => {
    const dataLacksEndingDot = !rr.data.endsWith(".");
    let needsEndingDot = false;

    switch (rr.type) {
      case "NS":
        if (rr.name === "@" && dataLacksEndingDot) {
          needsEndingDot = true;
        }
        break;
      case "MX":
        if (rr.name === "@" && dataLacksEndingDot) {
          needsEndingDot = true;
        }
        break;
      case "CNAME":
        if (rr.data !== "@" && dataLacksEndingDot) {
          needsEndingDot = true;
        }
    }

    if (needsEndingDot) {
      return Object.assign(rr, { data: rr.data + "." });
    } else {
      return rr;
    }
  });

  //
  // Ensure the domain doesn't already exist.
  //

  const digitalOceanWrapper = new DigitalOcean(defaultAccessToken());

  let domainAlreadyExists = true;
  try {
    await digitalOceanWrapper.domains.getByName(domain.name);
  } catch (ex) {
    const exAsAny: any = ex;
    if (exAsAny.response !== undefined && exAsAny.response.statusCode === 404) {
      domainAlreadyExists = false;
    } else {
      throw ex;
    }
  }
  if (domainAlreadyExists) {
    console.error(`ERR ${domain.name} already exists`);
    return;
  }

  //
  // Create the domain.
  //

  console.log(`creating ${domain.name}`);
  await digitalOceanWrapper.domains.create({
    name: domain.name,
    ip_address: ipAddressResourceRecord!.data,
  });

  //
  // Remove pre-populated Resource Records for a clean slate.
  //

  let prepopulatedDomainRecs = (await digitalOceanWrapper.domains.getAllRecords(
    domain.name,
    "",
    true
  )) as DomainRecordRequestOptionsWithID[];

  // Remove highest-level SOA record from queue of records to delete.
  prepopulatedDomainRecs = prepopulatedDomainRecs.filter(
    (rr) => !(rr.type === "SOA")
  );

  // Delete rest of records.
  for (const prepopulatedDomainRecItr of prepopulatedDomainRecs) {
    console.log(
      `  deleting prepopulated ${prepopulatedDomainRecItr.name} ${prepopulatedDomainRecItr.type} ${prepopulatedDomainRecItr.data} resource record`
    );
    await betterHTTPErrorReporting(async function () {
      await digitalOceanWrapper.domains.deleteRecord(
        domain.name,
        prepopulatedDomainRecItr.id
      );
    });
  }

  //
  // Upload resource records.
  //

  for (const recordItr of domain.records) {
    console.log(
      `  creating ${recordItr.name} ${recordItr.type} ${recordItr.data} resource record`
    );
    const newRecOpts: DomainRecordRequestOptions = {
      type: recordItr.type,
      name: recordItr.name,
      data: recordItr.data,
      // @ts-ignore-error
      priority: recordItr.priority,
      ttl: recordItr.ttl,
      tag: recordItr.tag === null ? "" : recordItr.tag,
    };
    // console.log({ newRecOpts });
    await betterHTTPErrorReporting(async function () {
      await digitalOceanWrapper.domains.createRecord(domain.name, newRecOpts);
    });
  }
}

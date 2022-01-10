import { defaultAccessToken, DODomain, DOResourceRecord } from "../util";

import DigitalOcean from "do-wrapper";
import { DomainRecordRequestOptions } from "do-wrapper/dist/types/domain";
import yargs, { CommandModule, Arguments } from "yargs";

import fs from "fs";
import path from "path";

export default {
  command: "backup",
  describe: "Downloads all DNS information",
  handler: backupCmd,
  builder: {
    dir: {
      description: "Path to output directory",
      type: "string",
      demand: true,
      requiresArg: true,
    },
  },
} as CommandModule;

type BackupArgs = Arguments & {
  dir: string;
};

async function backupCmd(args: Arguments) {
  const { dir: outputDirPath } = args as BackupArgs;

  const digitalOceanWrapper = new DigitalOcean(defaultAccessToken());
  const domains = await digitalOceanWrapper.domains.getAll("", true);
  for (const domainItr of domains) {
    console.log(domainItr.name);

    const domainRecs = (await digitalOceanWrapper.domains.getAllRecords(
      domainItr.name,
      "",
      true
    )) as DomainRecordRequestOptions[];

    const jsonOutputFilePath = path.join(
      outputDirPath,
      `${domainItr.name}.do-dns.json`
    );
    let resourceRecords: DOResourceRecord[] = domainRecs.map((x) => {
      return {
        type: x.type,
        name: x.name,
        data: x.data,
        priority: x.priority === undefined ? null : x.priority,
        ttl: x.ttl,
        tag: x.tag,
      };
    });
    // Remove redundant highest-level SOA record.
    resourceRecords = resourceRecords.filter((rr) => !(rr.type === "SOA"));
    const jsonOutput = {
      name: domainItr.name,
      ttl: domainItr.ttl,
      records: resourceRecords,
    };
    fs.writeFileSync(jsonOutputFilePath, JSON.stringify(jsonOutput, null, 2));

    const zoneOutputFilePath = path.join(
      outputDirPath,
      `${domainItr.name}.zone.txt`
    );
    fs.writeFileSync(zoneOutputFilePath, domainItr.zone_file);
  }
}

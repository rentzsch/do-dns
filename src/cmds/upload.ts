import { defaultAccessToken } from "../util";

import DigitalOcean from "do-wrapper";
import { DomainRecordRequestOptions } from "do-wrapper/dist/types/domain";
import yargs, { CommandModule, Arguments } from "yargs";

import fs from "fs";
import path from "path";

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

async function uploadCmd(args: Arguments) {
  const { file: inputFilePath } = args as UploadArgs;

  const digitalOceanWrapper = new DigitalOcean(defaultAccessToken());
  await digitalOceanWrapper.domains.create({ name: "", ip_address: "" });
  // name: string;
  // ip_address: string;
}

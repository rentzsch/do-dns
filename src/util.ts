const yaml = require("js-yaml");

import fs from "fs";
import process from "process";

export type DODomain = {
  name: string;
  ttl: number;
  records: DOResourceRecord[];
};

export type DOResourceRecord = {
  // Purposely leave behind id (transient), port, weight, and flags (always null) fields from DomainRecordRequestOptions.
  type: string;
  name: string;
  data: string;
  priority: number | null;
  ttl: number;
  tag: string | null;
};

export async function betterHTTPErrorReporting(f: Function) {
  try {
    return await f();
  } catch (ex) {
    const exAsAny: any = ex;
    if (exAsAny.response !== undefined) {
      console.error(
        `ERR ${exAsAny.response.statusCode} ${exAsAny.response.statusMessage}`
      );
      console.error(`ERR ${exAsAny.response.body}`);
    }
    throw ex;
  }
}

export function defaultAccessToken() {
  const configFilePath = defaultConfigYamlPath();
  const configYamlBuf = fs.readFileSync(configFilePath, "utf8");
  const config = yaml.load(configYamlBuf, { filename: configFilePath });

  return config["auth-contexts"][config.context];
}

function defaultConfigYamlPath() {
  // Default paths from https://docs.digitalocean.com/reference/doctl/reference/account/get/ :
  //   - macOS: ${HOME}/Library/Application Support/doctl/config.yaml
  //   - Linux: ${XDG_CONFIG_HOME}/doctl/config.yaml
  //   - Windows: %APPDATA%\doctl\config.yaml

  // How to get the OS platforms user data folder: https://stackoverflow.com/a/26227660

  if (process.env.APPDATA !== undefined) {
    return `${process.env.APPDATA}\\doctl\\config.yaml`;
  } else if (process.platform == "darwin") {
    return `${process.env.HOME}/Library/Application Support/doctl/config.yaml`;
  } else {
    return `${process.env.XDG_CONFIG_HOME}/doctl/config.yaml`;
  }
}

# do-dns

**do-dns** is a command-line tool for downloading and uploading Digital Ocean DNS records.

It uses the current access key you manage with `doctl auth`.

Given that context, it can:

- `do-dns download`: enumerate every domain it can see, creating two files representing the zone data for each domain:
  - `example.com.do-dns.json`: the zone data in a format that's native to Digital Ocean's REST v2 api.
  - `example.com.zone.txt`: the zone data in a format that's understandable by the classic [BIND](https://www.isc.org/bind/) name server.
- `do-dns upload`: upload a `*.do-dns.json` file previously downloaded by `do-dns`.

## Installation

```sh
$ npm install --global do-dns
```

## Download Usage Example

This example combines `do-dns` with `git` to give you a historical account of all your domains and their changes:

```sh
cd /path/to/do-dns-backup-repo
rm *
do-dns download --dir .
git status
git rm deleted-domain.do-dns.json deleted-domain.zone.txt
git add .
git commit -m "do-dns download `date '+%Y-%m-%d'`"
```

## Upload Usage Example

This example combines `do-dns` with `doctl` to download a domain's data, delete it, switch to another account's access key, and quickly upload the same domain. This effectively can migrate a domain from one Digital Ocean account to another, minimizing downtime (sadly Digital Ocean currently doesn't offer a migration service themselves).

```sh
TODO
```

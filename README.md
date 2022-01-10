# do-dns

**do-dns** is a command-line tool for downloading and uploading [Digital Ocean](https://www.digitalocean.com/) DNS records.

It uses the current access key you manage with <code><a href="https://docs.digitalocean.com/reference/doctl/reference/auth/">doctl auth</a></code>.

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
$ pwd
/tmp/do-dns-migration-demo
$ ls -l
$ doctl auth list
client
default
personal (current)
$ do-dns download --dir .
example.com
redshed.net
rentzsch.com
$ ls -l
-rw-r--r--  1 wolf  staff   662 Jan  9 21:51 example.com.do-dns.json
-rw-r--r--  1 wolf  staff   335 Jan  9 21:51 example.com.zone.txt
-rw-r--r--  1 wolf  staff  2225 Jan  9 21:51 redshed.net.do-dns.json
-rw-r--r--  1 wolf  staff   849 Jan  9 21:51 redshed.net.zone.txt
-rw-r--r--  1 wolf  staff   791 Jan  9 21:51 rentzsch.com.do-dns.json
-rw-r--r--  1 wolf  staff   355 Jan  9 21:51 rentzsch.com.zone.txt
$ doctl compute domain delete example.com
Warning: Are you sure you want to delete this domain? (y/N) ? y
$ doctl auth switch --context client
Now using context [client] by default
$ do-dns upload --file example.com.do-dns.json
creating example.com
  deleting prepopulated @ NS ns1.digitalocean.com resource record
  deleting prepopulated @ NS ns2.digitalocean.com resource record
  deleting prepopulated @ NS ns3.digitalocean.com resource record
  deleting prepopulated @ A 159.203.207.84 resource record
  creating @ NS ns1.digitalocean.com. resource record
  creating @ NS ns2.digitalocean.com. resource record
  creating @ NS ns3.digitalocean.com. resource record
  creating @ A 159.203.207.84 resource record
```

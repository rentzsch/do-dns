# do-dns

**do-dns** is a command-line tool for managing Digitial Ocean's DNS records.

Currently it can only backup (download) domains and zone data.

Eventually it will be able to create new domains by uploading an existing zone file.

## Backup Usage Example

```sh
cd /path/to/do-dns-backup-dir
rm *
npx do-dns backup --dir .
git status
git add .
git commit -m "do-dns backup `date '+%Y-%m-%d'`"
```
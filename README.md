# kubernetes-helpers [k8s]

This is a command line helper for kubernetes (`kubectl`).
It does provide some helping commands and eases up deployments.

### Install

```bash
npm install -g @smartive/kubernetes-helpers
```

This adds the `k8s` executable to your global bin.

If you don't have node installed, you can build executables for your system
with the `package` npm script.

### Usage

`k8s` -> Prints the help.

Please read the usage help to get along with the tool :)

Each command can be inspected by adding `--help` to the command.

### Configuration

All global settings and flags (like `context` and `namespace`) can
be configured via a `.k8src` or `.k8src.json` file. Please ensure, it is a valid
json.

Example:

```json
{
  "context": "my-kubernetes-ctx",
  "namespace": "kube-system"
}
```

This rc file can ensure, that you only execute certain commands in a certain context.

### Security

All information that are saved locally (if the user decides to do so) are stored in the
users `.kube` folder. The information is encrypted with the `aes-256-cbc` algorithm and the
unique machine key. They cannot be moved and are useless
on another machine (even a new installation).

### Development

- `check out source`
- `npm install`
- `npm run develop`

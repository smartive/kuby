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

-> Internal gitlab contains prebuilt executables.

### Usage
`k8s` -> Prints the help.

- `k8s kube-config`: Writes the given config content to the `~/.kube/config` path
- `k8s apply`: Executes `kubectl apply` with given files
- `k8s prepare`: Takes yaml files and replaces env vars in them
- `k8s delete`: Executes `prepare` and `kubectl delete` afterwards
- `k8s deploy`: Executes `prepare` and `apply` afterwards
- `k8s namespace`: Creates a namespace in kubernetes with optional docker secrets

#### Namespace
The namespace command does create a kubernetes namespace and asks the user if
a kubernetes secret should be provided (for docker pull). If the user decides to
do that, he can securely store the given answers locally. The answers are encrypted
with `aes-256-cbc` and the unique machine key. They cannot be moved and are useless
on another machine (even a new installation).

### Development
- `check out source`
- `npm install`
- `npm run develop`

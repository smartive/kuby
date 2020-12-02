module Kuby.Kubernetes.Context

let currentContext =
    let config = KubeConfig.load()

    config.Contexts
    |> Seq.tryFind (fun c -> c.Name = config.CurrentContext)

let currentContextName =
    match currentContext with
    | Some (ctx) -> Some ctx.Name
    | None -> None

let printableCurrentContextName =
    match currentContextName with
    | Some (ctx) -> ctx
    | None -> "<none>"

let contexts = KubeConfig.load().Contexts

let contextNames =
    contexts |> Seq.map (fun c -> c.Name) |> Seq.sort

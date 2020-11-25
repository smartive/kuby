module Kuby.Kubernetes.Namespace

open DotnetKubernetesClient
open k8s.Models

let private client = KubernetesClient()

let currentNamespace =
    match Context.currentContext with
    | None -> None
    | Some (ctx) ->
        match ctx.ContextDetails.Namespace with
        | null -> None
        | value -> Some value

let printableCurrentNamespace =
    match currentNamespace with
    | Some (ns) -> ns
    | None -> "default"

let namespaceNames =
    async {
        let! ns = client.List<V1Namespace>() |> Async.AwaitTask
        return ns |> Seq.map (fun a -> a.Name()) |> Seq.sort
    }

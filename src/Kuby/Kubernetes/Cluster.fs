module Kuby.Kubernetes.Cluster

let currentCluster =
    let config = KubeConfig.load()
    let currentClusterName = match Context.currentContext with
                             | Some(ctx) -> ctx.ContextDetails.Cluster
                             | None -> ""

    config.Clusters
    |> Seq.tryFind (fun c -> c.Name = currentClusterName)

let currentClusterName =
    match currentCluster with
    | Some(cluster) -> cluster.Name
    | None -> "<none>"

module Kuby.Kubernetes.KubeConfig

open System.Collections.Generic
open System.IO
open YamlDotNet.Core
open YamlDotNet.Serialization
open YamlDotNet.Serialization.EventEmitters
open YamlDotNet.Serialization.NamingConventions
open k8s
open k8s.KubeConfigModels

type private EmitterState(valuePeriod: int) =
    let mutable period = valuePeriod
    let mutable currentIndex = 0

    member this.VisitNext() =
        currentIndex <- currentIndex + 1
        currentIndex % period = 0

type private StringEmitter(next: IEventEmitter) =
    inherit ChainedEventEmitter(next)

    let state = Stack<EmitterState>()

    do state.Push <| EmitterState(1)

    override this.Emit(eventInfo: ScalarEventInfo, emitter: IEmitter): unit =
        if state.Peek().VisitNext()
           && eventInfo.Source.Type = typeof<string> then
            eventInfo.Style <- ScalarStyle.DoubleQuoted

        base.Emit(eventInfo, emitter)

    override this.Emit(eventInfo: MappingStartEventInfo, emitter: IEmitter): unit =
        state.Peek().VisitNext() |> ignore
        state.Push <| EmitterState(2)
        base.Emit(eventInfo, emitter)

    override this.Emit(eventInfo: MappingEndEventInfo, emitter: IEmitter): unit =
        state.Pop() |> ignore
        base.Emit(eventInfo, emitter)

    override this.Emit(eventInfo: SequenceStartEventInfo, emitter: IEmitter): unit =
        state.Peek().VisitNext() |> ignore
        state.Push <| EmitterState(1)
        base.Emit(eventInfo, emitter)

    override this.Emit(eventInfo: SequenceEndEventInfo, emitter: IEmitter): unit =
        state.Pop() |> ignore
        base.Emit(eventInfo, emitter)

let private serializer =
    SerializerBuilder()
        .ConfigureDefaultValuesHandling(DefaultValuesHandling.OmitDefaults)
        .WithNamingConvention(CamelCaseNamingConvention.Instance)
        .WithEventEmitter(fun n -> StringEmitter(n))
        .Build()

let load () =
    KubernetesClientConfiguration.LoadKubeConfig()

let save (config: K8SConfiguration) =
    File.WriteAllText(config.FileName, (serializer.Serialize config))

let toString (config: K8SConfiguration) = serializer.Serialize config

let update (updater: K8SConfiguration -> unit) =
    let config = load ()
    updater config
    save config

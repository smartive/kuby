using System.Collections.Generic;
using JetBrains.Annotations;
using Nuke.Common;
using Nuke.Common.CI;
using Nuke.Common.Execution;
using Nuke.Common.IO;
using Nuke.Common.ProjectModel;
using Nuke.Common.Tooling;
using Nuke.Common.Tools.DotNet;
using Nuke.Common.Utilities.Collections;
using static Nuke.Common.IO.FileSystemTasks;
using static Nuke.Common.Tools.DotNet.DotNetTasks;

[CheckBuildProjectConfigurations]
[ShutdownDotNetAfterServerBuild]
class Build : NukeBuild
{
    public static int Main() => Execute<Build>(x => x.Compile);

    [Parameter("Configuration to build - Default is 'Debug' (local) or 'Release' (server)")]
    readonly Configuration Configuration = IsLocalBuild ? Configuration.Debug : Configuration.Release;

    [Parameter("Version number that is built.")] readonly string Version = "0.0.0";

    [Parameter("Single Runtime that should be built.")] [CanBeNull] readonly string Runtime;

    [Solution] readonly Solution Solution;

    AbsolutePath SourceDirectory => RootDirectory / "src";
    AbsolutePath TestsDirectory => RootDirectory / "tests";
    AbsolutePath ArtifactsDirectory => RootDirectory / "artifacts";

    IEnumerable<string> Runtimes = new[] {"linux-x64", "osx-x64", "win-x64"};

    Target Clean => _ => _
        .Before(Restore)
        .Executes(() =>
        {
            SourceDirectory.GlobDirectories("**/bin", "**/obj").ForEach(DeleteDirectory);
            TestsDirectory.GlobDirectories("**/bin", "**/obj").ForEach(DeleteDirectory);
            EnsureCleanDirectory(ArtifactsDirectory);
        });

    Target Restore => _ => _
        .Executes(() => DotNetRestore(s => s.SetProjectFile(Solution)));

    Target Compile => _ => _
        .DependsOn(Restore)
        .Executes(() => DotNetBuild(s => s
            .SetProjectFile(Solution)
            .SetConfiguration(Configuration)
            .EnableNoRestore()));

    Target Publish => _ => _
        .DependsOn(Clean)
        .Executes(() => DotNetPublish(s => s
            .SetProject(Solution)
            .SetConfiguration(Configuration)
            .SetVersion(Version)
            .SetAssemblyVersion(Version)
            .SetFileVersion(Version)
            .SetInformationalVersion(Version)
            .AddProperty("SelfContained", true)
            .AddProperty("PublishSingleFile", true)
            .AddProperty("IncludeNativeLibrariesForSelfExtract", true)
            .AddProperty("PublishTrimmed", Equals(Configuration, Configuration.Release))
            .CombineWith(
                Runtimes,
                (settings, runtime) => settings
                    .SetRuntime(runtime)
                    .SetOutput(ArtifactsDirectory / runtime))));

    Target PublishSingle => _ => _
        .DependsOn(Clean)
        .Requires(() => !string.IsNullOrWhiteSpace(Runtime))
        .Executes(() => DotNetPublish(s => s
            .SetProject(Solution)
            .SetConfiguration(Configuration)
            .SetVersion(Version)
            .SetAssemblyVersion(Version)
            .SetFileVersion(Version)
            .SetInformationalVersion(Version)
            .AddProperty("SelfContained", true)
            .AddProperty("IncludeNativeLibrariesForSelfExtract", true)
            .AddProperty("PublishSingleFile", true)
            .AddProperty("PublishTrimmed", Equals(Configuration, Configuration.Release))
            .SetRuntime(Runtime)
            .SetOutput(ArtifactsDirectory / Runtime)
        ));
}

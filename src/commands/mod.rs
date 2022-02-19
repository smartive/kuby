use clap::Subcommand;

pub mod context;
pub mod namespace;

const CONTEXT_LONG_ABOUT: &str = r#"This command lets you switch your current Kubernetes context.
When you provide a new context (via the name attribute) the new context
is directly selected if possible. If you omit the name,
a list of avilabile contexts is shown and you can select one."#;
const NAMESPACE_LONG_ABOUT: &str = r#"This command lets you switch your current Kubernetes namespace.
When you provide a new namespace (via the name attribute) the new namespace
is directly selected if possible. If you omit the name,
a list of avilabile namespaces is shown and you can select one."#;

#[derive(Subcommand)]
pub enum Commands {
    #[clap(about = "Directly switch a context or show a list of available context", long_about = CONTEXT_LONG_ABOUT)]
    #[clap(visible_alias = "ctx", visible_alias = "c")]
    Context {
        /// The new context to switch to.
        name: Option<String>,
    },
    #[clap(about = "Directly switch a namespace or show a list of available namespaces", long_about = NAMESPACE_LONG_ABOUT)]
    #[clap(visible_alias = "ns", visible_alias = "n")]
    Namespace {
        /// The new namespace to switch to.
        name: Option<String>,
    },
}

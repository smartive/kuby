use clap::{AppSettings, Parser};

use crate::commands::context::context;
use crate::commands::namespace::namespace;
use crate::commands::Commands;

mod commands;
mod kubeconfig;

#[derive(Parser)]
#[clap(version, about, long_about = None)]
#[clap(global_setting(AppSettings::PropagateVersion))]
#[clap(global_setting(AppSettings::UseLongFormatForHelpSubcommand))]
struct Cli {
    #[clap(subcommand)]
    command: Commands,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Context { name } => context(name).await?,
        Commands::Namespace { name } => namespace(name).await?,
    }

    Ok(())
}

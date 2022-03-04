use std::fs::File;
use std::io::Write;
use std::path::PathBuf;

use kube::config::{Kubeconfig, KubeconfigError};

pub fn load() -> Result<Kubeconfig, KubeconfigError> {
    Kubeconfig::read()
}

pub fn save(config: &Kubeconfig) -> Result<(), Box<dyn std::error::Error>> {
    let yaml = serde_yaml::to_string(&config)?;
    let mut file = File::create(default_kube_path().expect("No default config path available."))?;
    file.write_all(yaml.as_bytes())?;

    Ok(())
}

fn default_kube_path() -> Option<PathBuf> {
    use dirs::home_dir;
    home_dir().map(|h| h.join(".kube").join("config"))
}

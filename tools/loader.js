const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');
const _ = require('lodash');

class Resources {
  constructor() {
    this.appPath = path.resolve('./');
    this.workspaces = ['services'];
  }

  loadFiles() {
    const fileList = [];
    this.workspaces.forEach(workspace => {
      const services = fs.readdirSync(path.join(this.appPath, workspace));
      console.log(services)
      services.forEach(service => {
        if (service !== 'common') {
          const configs = fs.readdirSync(
            path.join(this.appPath, workspace, service)
          );
          configs.forEach(conf => {
            const types = conf.replace(/\.(yml|json|js)/gi, '');
            if (types.indexOf('functions') > -1) {
              fileList.push({
                type: 'functions',
                path: path.join(this.appPath, workspace, service, conf),
              });
            } else if (types === 'resources') {
              const resourceFiles = fs.readdirSync(
                path.join(this.appPath, workspace, service, conf)
              );
              resourceFiles.forEach(resource => {
                fileList.push({
                  type: 'resources',
                  path: path.join(
                    this.appPath,
                    workspace,
                    service,
                    conf,
                    resource
                  ),
                });
              });
            } else if (types === 'environments') {
              fileList.push({
                type: 'environments',
                path: path.join(this.appPath, workspace, service, conf),
              });
            }
          });
        }
      });
    });
    return fileList;
  }

  loadYamlFile(files) {
    const merged = files
      .map(file => fs.readFileSync(file, 'utf8'))
      .map(raw => YAML.parse(raw))
      .reduce((result, handler) => _.merge(result, handler), {});
    return merged;
  }

  getAll() {
    const allFiles = this.loadFiles();
    const data = {
      functions: this.loadYamlFile(
        _.map(_.filter(allFiles, { type: 'functions' }), 'path')
      ),
      environments: this.loadYamlFile(
        _.map(_.filter(allFiles, { type: 'environments' }), 'path')
      ),
    };

    console.log(data)
    return data;
  }
}

const config = new Resources();
const resources = config.getAll();
const env = process.env.SLS_STAGE || 'local';

module.exports = {
  functions: () => resources.functions,
  resources: () => resources.resources,
  environments: () => resources.environments[env],
};

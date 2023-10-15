import * as core from '@actions/core';
import {parseCSVArray} from './utils';

export enum OperationType {
  GET_FIELDS = 'GET',
  SET_FIELDS = 'SET',
  CLEAR_FIELDS = 'CLEAR',
}

interface RawInputs {
  operation: string;

  fields: string;
  project_url: string;

  github_token: string;
  resource_url: string;
  values?: string;
}

interface Inputs {
  operation: OperationType;

  fields: string[];
  project: {
    owner: string;
    ownerType: 'users' | 'orgs';
    number: number;
  };

  github_token: string;
  resource: {
    owner: string;
    repo: string;
    type: 'pull' | 'issues';
    number: number;
    url: string;
  };
  values?: string[];
}

interface Outputs {
  values: string;
}

export async function getInputs(): Promise<Inputs> {
  const raw: RawInputs = {
    operation: core.getInput('operation', {required: true}),
    fields: core.getInput('fields', {required: true}),
    project_url: core.getInput('project_url', {required: true}),
    github_token: core.getInput('github_token', {required: true}),
    resource_url: core.getInput('resource_url', {required: true}),
    values: core.getInput('values', {required: false}),
  };
  const inputs = {} as Inputs;

  // #region operation
  const operation: OperationType | null = parseOperationType(raw.operation);
  if (operation === null) throw new Error('Specified operation is invalid');

  inputs.operation = operation as OperationType;
  // #endregion

  // #region fields
  try {
    inputs.fields = parseCSVArray(raw.fields);
  } catch (e) {
    throw new Error(`fields: ${e}`);
  }
  if (inputs.fields.length === 0) throw new Error('fields is empty');
  // #endregion

  // #region project_url
  const PROJECT_URL_REGEX =
    /^.*github.com\/(?<type>users|orgs)\/(?<owner>[0-9a-zA-Z-._]+)\/projects\/(?<number>\d+)\/?(views\/(?<view>\d+))?\/?$/;
  const projectMatchGroups = raw.project_url.match(PROJECT_URL_REGEX)?.groups;

  if (!projectMatchGroups)
    throw new Error('project_url is invalid: no matched groups');
  if (!projectMatchGroups['type'])
    throw new Error('project_url is invalid: no type');
  if (!projectMatchGroups['owner'])
    throw new Error('project_url is invalid: no owner');
  if (!projectMatchGroups['number'])
    throw new Error('project_url is invalid: no number');
  if (!Number.isInteger(Number(projectMatchGroups['number'])))
    throw new Error('project_url is invalid: number is not an integer');

  inputs.project = {
    number: parseInt(projectMatchGroups['number']),
    owner: projectMatchGroups['owner'],
    ownerType: projectMatchGroups['type'] as 'users' | 'orgs',
  };
  // #endregion

  // #region github_token
  inputs.github_token = raw.github_token;
  // #endregion

  // #region resource_url
  const RESOURCE_URL_REGEX =
    /^.*github.com\/(?<owner>[0-9a-zA-Z-._]+)\/(?<repo>[0-9a-zA-Z-._]+)\/(?<type>pull|issues)\/(?<number>\d+)\/?$/;
  const resourceMatchGroups =
    raw.resource_url.match(RESOURCE_URL_REGEX)?.groups;

  if (!resourceMatchGroups)
    throw new Error('resource_url is invalid: no matched groups');
  if (!resourceMatchGroups['owner'])
    throw new Error('resource_url is invalid: no owner');
  if (!resourceMatchGroups['repo'])
    throw new Error('resource_url is invalid: no repo');
  if (!resourceMatchGroups['type'])
    throw new Error('resource_url is invalid: no type');
  if (!resourceMatchGroups['number'])
    throw new Error('resource_url is invalid: no number');
  if (!Number.isInteger(Number(resourceMatchGroups['number'])))
    throw new Error('resource_url is invalid: number is not an integer');

  inputs.resource = {
    owner: resourceMatchGroups['owner'],
    repo: resourceMatchGroups['repo'],
    type: resourceMatchGroups['type'] as 'pull' | 'issues',
    number: parseInt(resourceMatchGroups['number']),
    url: raw.resource_url,
  };
  // #endregion

  // #region values
  if (raw.values) {
    try {
      inputs.values = parseCSVArray(raw.values);
    } catch (e) {
      throw new Error(`values: ${e}`);
    }
    if (inputs.values.length === 0) throw new Error('values is empty');
    if (inputs.values.length !== inputs.fields.length)
      throw new Error('values and fields should have the same length');
  }
  // #endregion

  return inputs;
}

/** Converts a string into an `OperationType` */
function parseOperationType(value: string): OperationType | null {
  const uc: string = value.toUpperCase();
  if (Object.values(OperationType).findIndex(x => x === uc) >= 0) {
    return uc as OperationType;
  }
  return null;
}

const outputs = {} as Outputs;

/** Lets you set an output that will also be logged */
export function setOutput<T extends keyof Outputs>(key: T, value: Outputs[T]) {
  core.setOutput(key, value);
  outputs[key] = value;
}

/** Logs all cached outputs */
export function logOutputs() {
  core.startGroup('Outputs:');
  for (const key in outputs) {
    core.info(`${key}: ${outputs[key as keyof Outputs]}`);
  }
  core.endGroup();
}

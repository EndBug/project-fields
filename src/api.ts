import {getOctokit} from '@actions/github';
import * as fs from 'fs';
import * as path from 'path';
import {ExcludeEmpty, checkType} from './utils';

// #region Types
export type FieldDataType =
  | 'ASSIGNEES'
  | 'LINKED_PULL_REQUESTS'
  | 'REVIEWERS'
  | 'LABELS'
  | 'MILESTONE'
  | 'REPOSITORY'
  | 'TITLE'
  | 'TEXT'
  | 'SINGLE_SELECT'
  | 'NUMBER'
  | 'DATE'
  | 'ITERATION'
  | 'TRACKS'
  | 'TRACKED_BY';

interface RawGetFieldResponse {
  data: {
    repositoryOwner: {
      projectV2: {
        field:
          | {
              id: string;
              dataType: 'SINGLE_SELECT';
              options: {
                id: string;
                name: string;
              }[];
            }
          | {
              id: string;
              dataType: Exclude<FieldDataType, 'SINGLE_SELECT'>;
            };
      };
    };
  };
}

interface RawGetFieldValuesResponse {
  data: {
    resource: {
      projectItems: {
        nodes: {
          itemId: string;
          project: {
            id: string;
          };
          fieldValues: {
            totalCount: number;
            nodes: (
              | {}
              | {
                  field: {
                    name: string;
                    id: string;
                    dataType: FieldDataType;
                  };
                  text?: string;
                  name?: string;
                  number?: number;
                  date?: string;
                }
            )[];
          };
        }[];
      };
    };
  };
}
type FieldValueNode = ExcludeEmpty<
  RawGetFieldValuesResponse['data']['resource']['projectItems']['nodes'][number]['fieldValues']['nodes'][number]
>;

type FieldsResult = Record<
  string,
  {
    value: string | number | undefined;
    type: 'TEXT' | 'SINGLE_SELECT' | 'NUMBER' | 'DATE';
    id: string;
  }
>;

interface RawGetItemIdResponse {
  data: {
    resource: {
      projectItems: {
        nodes: {
          itemId: string;
          project: {
            id: string;
          };
        }[];
      };
    };
  };
}

interface RawGetProjectIdResponse {
  data: {
    repositoryOwner: {
      projectV2: {
        id: string;
      };
    };
  };
}
// #endregion

export class Octo {
  octokit;
  queries: Record<
    'getField' | 'getFieldValues' | 'getItemId' | 'getProjectId',
    string
  >;
  mutations: Record<'clearFieldValue' | 'setFieldValue', string>;

  constructor(token: string) {
    this.octokit = getOctokit(token);
    this.queries = {
      getField: this._readQuery('getField'),
      getFieldValues: this._readQuery('getFieldValues'),
      getItemId: this._readQuery('getItemId'),
      getProjectId: this._readQuery('getProjectId'),
    };
    this.mutations = {
      clearFieldValue: this._readMutation('clearFieldValue'),
      setFieldValue: this._readMutation('setFieldValue'),
    };
  }

  /**
   * Reads a query from the `query` directory
   * @param name The name of the query to read
   */
  private _readQuery(name: string) {
    return fs.readFileSync(
      path.join(__dirname, './query', `${name}.graphql`),
      'utf8'
    );
  }

  /**
   * Reads a mutation from the `mutation` directory
   * @param name The name of the mutation to read
   */
  private _readMutation(name: string) {
    return fs.readFileSync(
      path.join(__dirname, './mutation', `${name}.graphql`),
      'utf8'
    );
  }

  /**
   * Gets info about a field in a project
   * @param projectOwner The user or organization that owns the project
   * @param projectNumber The number of the project
   * @param fieldName The name of the field
   * @returns Info about the field
   */
  async getField(
    projectOwner: string,
    projectNumber: number,
    fieldName: string
  ): Promise<
    RawGetFieldResponse['data']['repositoryOwner']['projectV2']['field']
  > {
    const response = await this.octokit.graphql<RawGetFieldResponse>(
      this.queries.getField,
      {
        owner: projectOwner,
        projectNumber,
        fieldName,
      }
    );

    const field = response.data.repositoryOwner.projectV2.field;
    if (!field)
      throw new Error(
        `Could not find field ${fieldName} in project ${projectOwner}/${projectNumber}`
      );

    return field;
  }

  /**
   * Gets the field values for a project item
   * @param resourceUrl The link to the issue or PR
   * @param projectId The ID of the project
   * @returns An object with each field name as a key and the field value as the value
   */
  async getFieldValues(
    resourceUrl: string,
    projectId: string
  ): Promise<FieldsResult> {
    const response = await this.octokit.graphql<RawGetFieldValuesResponse>(
      this.queries.getFieldValues,
      {
        resourceUrl,
      }
    );

    const projectNode = response.data.resource.projectItems.nodes.find(
      node => node.project.id === projectId
    );
    if (!projectNode)
      throw new Error(
        `Could not find project with ID ${projectId} in resource ${resourceUrl}`
      );

    const result = {} as FieldsResult;

    projectNode.fieldValues.nodes.forEach(node => {
      // Type guard to ensure that the node is not `{}` (empty)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!checkType<FieldValueNode>(node, (n: any) => n.field?.name)) return;

      switch (node.field.dataType) {
        case 'TEXT':
          result[node.field.name] = {
            value: node.text,
            type: node.field.dataType,
            id: node.field.id,
          };
          break;
        case 'SINGLE_SELECT':
          result[node.field.name] = {
            value: node.name,
            type: node.field.dataType,
            id: node.field.id,
          };
          break;
        case 'NUMBER':
          result[node.field.name] = {
            value: node.number,
            type: node.field.dataType,
            id: node.field.id,
          };
          break;
        case 'DATE':
          result[node.field.name] = {
            value: node.date,
            type: node.field.dataType,
            id: node.field.id,
          };
          break;
        default:
          break;
      }
    });

    return result;
  }

  /**
   * Gets the id of a project item
   * @param resourceUrl The link to the issue or PR
   * @param projectId The ID of the project
   * @returns The item ID
   */
  async getItemId(resourceUrl: string, projectId: string): Promise<string> {
    const response = await this.octokit.graphql<RawGetItemIdResponse>(
      this.queries.getItemId,
      {
        resourceUrl,
      }
    );

    const projectNode = response.data.resource.projectItems.nodes.find(
      node => node.project.id === projectId
    );
    if (!projectNode)
      throw new Error(
        `Could not find project with ID ${projectId} in resource ${resourceUrl}`
      );

    return projectNode.itemId;
  }

  /**
   * Gets the ID of a project
   * @param projectOwner The user or organization that owns the project
   * @param projectNumber The number of the project
   * @returns The project ID
   */
  async getProjectId(
    projectOwner: string,
    projectNumber: number
  ): Promise<string> {
    const response = await this.octokit.graphql<RawGetProjectIdResponse>(
      this.queries.getProjectId,
      {
        owner: projectOwner,
        number: projectNumber,
      }
    );

    return response.data.repositoryOwner.projectV2.id;
  }

  async clearFieldValue(projectId: string, itemId: string, fieldId: string) {
    await this.octokit.graphql(this.mutations.clearFieldValue, {
      projectId,
      itemId,
      fieldId,
    });
  }

  async setFieldValue(
    projectId: string,
    itemId: string,
    fieldId: string,
    value:
      | {
          text: string;
        }
      | {
          number: number;
        }
      | {date: string}
      | {singleSelectOptionId: string}
  ) {
    await this.octokit.graphql(this.mutations.setFieldValue, {
      projectId,
      itemId,
      fieldId,
      value,
    });
  }
}

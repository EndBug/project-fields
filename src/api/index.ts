import {getOctokit} from '@actions/github';
import * as fs from 'fs';
import * as path from 'path';
import {ExcludeEmpty, checkType, debug} from '../utils';
import {
  Request,
  RequestParams,
  Response,
  supportedMutations,
  supportedQueries,
} from './generated';

type FieldValueNode = ExcludeEmpty<
  Response<'getFieldValues'>['data']['resource']['projectItems']['nodes'][number]['fieldValues']['nodes'][number]
>;

type FieldsResult = Record<
  string,
  {
    value: string | number | undefined;
    type: 'TEXT' | 'SINGLE_SELECT' | 'NUMBER' | 'DATE';
    id: string;
  }
>;

export class Octo {
  octokit;
  requests: Record<Request, string>;

  constructor(token: string) {
    this.octokit = getOctokit(token);

    this.requests = {} as Record<Request, string>;

    supportedQueries.forEach(query => {
      this.requests[query] = fs.readFileSync(
        path.join(__dirname, './query', `${query}.graphql`),
        'utf8'
      );
    });
    supportedMutations.forEach(mutation => {
      this.requests[mutation] = fs.readFileSync(
        path.join(__dirname, './mutation', `${mutation}.graphql`),
        'utf8'
      );
    });
  }

  private async _request<T extends Request>(
    req: T,
    params: RequestParams<T>
  ): Promise<Response<T>> {
    debug(`Requesting ${req} with params: ${JSON.stringify(params)}`);

    const res: Response<T> = await this.octokit.graphql(
      this.requests[req],
      params
    );

    debug(`Response: ${JSON.stringify(res)}`);
    return res;
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
  ) {
    const response = await this._request('getField', {
      owner: projectOwner,
      projectNumber,
      fieldName,
    });

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
    const response = await this._request('getFieldValues', {
      resourceUrl,
    });

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
  async getItemId(resourceUrl: string, projectId: string) {
    const response = await this._request('getItemId', {
      resourceUrl,
    });

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
  async getProjectId(projectOwner: string, projectNumber: number) {
    const response = await this._request('getProjectId', {
      owner: projectOwner,
      number: projectNumber,
    });

    return response.data.repositoryOwner.projectV2.id;
  }

  async clearFieldValue(projectId: string, itemId: string, fieldId: string) {
    await this._request('clearItemFieldValue', {
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
    await this._request('setItemFieldValue', {
      projectId,
      itemId,
      fieldId,
      value,
    });
  }
}

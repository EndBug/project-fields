import { FieldDataType, Request } from './generated';
type FieldsResult = Record<string, {
    value: string | number | undefined;
    type: 'TEXT' | 'SINGLE_SELECT' | 'NUMBER' | 'DATE' | 'ITERATION';
    id: string;
    unsupported?: false;
} | {
    value?: never;
    id: string;
    type: FieldDataType;
    unsupported: true;
}>;
export declare class Octo {
    octokit: import("@octokit/core").Octokit & import("@octokit/plugin-rest-endpoint-methods/dist-types/types").Api & {
        paginate: import("@octokit/plugin-paginate-rest").PaginateInterface;
    };
    requests: Record<Request, string>;
    constructor(token: string);
    private _request;
    /**
     * Gets info about a field in a project
     * @param projectOwner The user or organization that owns the project
     * @param projectNumber The number of the project
     * @param fieldName The name of the field
     * @returns Info about the field
     */
    getField(projectOwner: string, projectNumber: number, fieldName: string): Promise<{
        id: string;
        dataType: "SINGLE_SELECT";
        options: {
            id: string;
            name: string;
        }[];
    } | {
        id: string;
        dataType: "ITERATION";
        configuration: {
            iterations: {
                id: string;
                title: string;
            }[];
            completedIterations: {
                id: string;
                title: string;
            }[];
        };
    } | {
        id: string;
        dataType: Exclude<FieldDataType, "SINGLE_SELECT" | "ITERATION">;
    }>;
    /**
     * Gets the field values for a project item
     * @param resourceUrl The link to the issue or PR
     * @param projectId The ID of the project
     * @returns An object with each field name as a key and the field value as the value
     */
    getFieldValues(resourceUrl: string, projectId: string): Promise<FieldsResult>;
    /**
     * Gets the id of a project item
     * @param resourceUrl The link to the issue or PR
     * @param projectId The ID of the project
     * @returns The item ID
     */
    getItemId(resourceUrl: string, projectId: string): Promise<string>;
    /**
     * Gets the ID of a project
     * @param projectOwner The user or organization that owns the project
     * @param projectNumber The number of the project
     * @returns The project ID
     */
    getProjectId(projectOwner: string, projectNumber: number): Promise<string>;
    clearFieldValue(projectId: string, itemId: string, fieldId: string): Promise<void>;
    setFieldValue(projectId: string, itemId: string, fieldId: string, value: {
        text: string;
    } | {
        number: number;
    } | {
        date: string;
    } | {
        singleSelectOptionId: string;
    } | {
        iterationId: string;
    }): Promise<void>;
}
export {};

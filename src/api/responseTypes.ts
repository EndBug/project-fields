import {FieldDataType} from './generated';

export interface getField {
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
            dataType: 'ITERATION';
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
          }
        | {
            id: string;
            dataType: Exclude<FieldDataType, 'SINGLE_SELECT' | 'ITERATION'>;
          };
    };
  };
}

export interface getFieldValues {
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
                title?: string;
              }
          )[];
        };
      }[];
    };
  };
}

export interface getItemId {
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
}

export interface getProjectId {
  repositoryOwner: {
    projectV2: {
      id: string;
    };
  };
}

export interface clearItemFieldValue {
  clientMutationId: string;
}

export interface setItemFieldValue {
  clientMutationId: string;
}

import {FieldDataType} from './generated';

export interface getField {
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

export interface getFieldValues {
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

export interface getItemId {
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

export interface getProjectId {
  data: {
    repositoryOwner: {
      projectV2: {
        id: string;
      };
    };
  };
}

export interface clearItemFieldValue {
  clientMutationId: string;
}

export interface setItemFieldValue {
  clientMutationId: string;
}

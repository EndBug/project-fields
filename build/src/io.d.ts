export declare enum OperationType {
    GET_FIELDS = "GET",
    SET_FIELDS = "SET",
    CLEAR_FIELDS = "CLEAR"
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
export declare function getInputs(): Promise<Inputs>;
/** Lets you set an output that will also be logged */
export declare function setOutput<T extends keyof Outputs>(key: T, value: Outputs[T]): void;
/** Logs all cached outputs */
export declare function logOutputs(): void;
export {};

import { SpecsfyAdapter } from "../specsfy/adapter.js";
export interface DoctorCheck {
    name: string;
    ok: boolean;
    detail: string;
}
export declare function doctorProject(project: string, adapter?: SpecsfyAdapter): Promise<DoctorCheck[]>;

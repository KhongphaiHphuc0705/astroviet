import { DataIntegrityError } from '../errors/chart.errors.js';

export type WarningSeverity = 'info' | 'warning';

export interface WarningProps {
  readonly code: string;
  readonly message: string;
  readonly severity: WarningSeverity;
  readonly field?: string;
  readonly details?: Record<string, unknown>;
}

export class Warning {
  private constructor(
    private readonly _code: string,
    private readonly _message: string,
    private readonly _severity: WarningSeverity,
    private readonly _field?: string,
    private readonly _details?: Record<string, unknown>,
  ) {}

  public get code(): string {
    return this._code;
  }

  public get message(): string {
    return this._message;
  }

  public get severity(): WarningSeverity {
    return this._severity;
  }

  public get field(): string | undefined {
    return this._field;
  }

  public get details(): Record<string, unknown> | undefined {
    return this._details;
  }

  public static create(props: WarningProps): Warning {
    if (props.severity !== 'info' && props.severity !== 'warning') {
      throw new DataIntegrityError(`Invalid warning severity: ${props.severity}`);
    }

    return new Warning(
      props.code,
      props.message,
      props.severity,
      props.field,
      props.details ? { ...props.details } : undefined,
    );
  }
}

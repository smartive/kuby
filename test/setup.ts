import { CoreV1Api, V1Namespace, V1Secret } from '@kubernetes/client-node';
import 'clipboardy';
import 'inquirer';
import '../src/utils/exec';
import '../src/utils/extensions';
import '../src/utils/kubernetes-api';
import '../src/utils/logger';
import '../src/utils/spawn';

jest.mock('fs');
jest.mock('../src/utils/spawn', () => ({
  spawn: jest.fn(() => 0),
}));
jest.mock('../src/utils/exec', () => ({
  exec: jest.fn(),
}));
jest.mock('../src/utils/logger', () => ({
  LogLevel: {},
  Logger: class FakeLogger {
    public static instance: FakeLogger;

    public debug: jest.Mock = jest.fn();
    public info: jest.Mock = jest.fn();
    public output: jest.Mock = jest.fn();
    public success: jest.Mock = jest.fn();
    public warn: jest.Mock = jest.fn();
    public error: jest.Mock = jest.fn();
    public startSpinner: jest.Mock = jest.fn();
    public stopSpinner: jest.Mock = jest.fn();
    public setSpinnerText: jest.Mock = jest.fn();
    public spinnerSuccess: jest.Mock = jest.fn();
    public spinnerFail: jest.Mock = jest.fn();

    constructor() {
      FakeLogger.instance = this;
    }
  },
}));
jest.mock('clipboardy', () => ({
  write: jest.fn(),
}));
jest.mock('inquirer', () => ({
  registerPrompt: jest.fn(),
  Separator: jest.fn(() => ({})),
  prompt: jest
    .fn()
    .mockImplementation(async (questions: any[]) => questions.map(q => (q.default !== undefined ? q.default : q.name))),
}));

jest.mock('../src/utils/kubernetes-api', () => ({
  KubernetesApi: class FakeKubernetesApi {
    public static instance: FakeKubernetesApi;

    public currentNamespace: string = 'default';

    public core: CoreV1Api = ({
      createNamespacedSecret: jest.fn().mockImplementation(async (_ns: string, secret: V1Secret) => ({ body: secret })),
      readNamespace: jest.fn().mockResolvedValue({}),
      createNamespace: jest.fn().mockImplementation(async (_ns: string, namespace: V1Namespace) => ({ body: namespace })),
    } as unknown) as CoreV1Api;

    private constructor() {}

    public static create(): void {
      FakeKubernetesApi.instance = new FakeKubernetesApi();
    }

    public static fromDefault(): FakeKubernetesApi {
      return FakeKubernetesApi.instance;
    }

    public static fromString(): FakeKubernetesApi {
      return FakeKubernetesApi.instance;
    }
  },
}));

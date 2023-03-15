interface GeneratorConfig {
  isGenSpec?: boolean;
  isCreatePolicy?: boolean;
  versionPrefix?: string;
  clientSDKs?: {
    type: 'cocos' | 'unity' | 'js' | 'ts',
    outPath: string,
    isCleanUp: boolean, // delete old generated
  }[];
  excludedSpec?: string[];
  routerMode?: 'userId' | 'decoded'; // default decoded
}

export function start(options: GeneratorConfig): Promise<any>;

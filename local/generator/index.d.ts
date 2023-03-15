interface GeneratorConfig {
  isCreatePolicy?: boolean;
  clientSDKs?: {
    type: 'cocos' | 'unity' | 'js' | 'ts',
    outPath: string,
    isCleanUp: boolean, // delete old generated
  }[];
  excludedSpec?: string; // default all
  routerMode?: 'userId' | 'decoded'; // default decoded
}

export function start(options: GeneratorConfig): Promise<any>;

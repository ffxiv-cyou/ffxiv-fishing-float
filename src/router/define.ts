
export interface RouteConfig {
  path: string;
  name: string;
  component: any;
}

export interface NavTree {
  name: string;
  path?: string;
  children?: NavTree[];
}

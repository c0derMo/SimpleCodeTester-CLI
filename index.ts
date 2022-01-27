import { ConfigProvider } from "./ConfigProvider";

const cfgProvider = new ConfigProvider();
void cfgProvider.parseCommandLine(process.argv);

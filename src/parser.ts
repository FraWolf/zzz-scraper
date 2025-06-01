import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import {
  formatToId,
  cleanFromHTML,
  replaceDollarSign,
  wikiAppName,
  isStringifiedObject,
} from "./utils";

async function main() {
  const mergedResults: any[] = [];

  const folderTree = "character_database";
  // const folderTree = "storage_items";

  const folderEntries = readdirSync(
    `data/${wikiAppName}/${folderTree}/entries`
  ).map((file) => {
    return readFileSync(
      `data/${wikiAppName}/${folderTree}/entries/${file}`,
      "utf8"
    );
  });

  const parsedFolder = existsSync(`data/${wikiAppName}/${folderTree}/parsed`);
  if (!parsedFolder) {
    mkdirSync(`data/${wikiAppName}/${folderTree}/parsed`, { recursive: true });
  }

  const allowedComponents: string[] = [
    "baseInfo",
    "ascension",
    "talent",
    "textual_research",
  ];

  for (let fileIndex in folderEntries) {
    const dataFile = folderEntries[fileIndex];
    const parsedFile = JSON.parse(dataFile);
    console.log(`[${parsedFile?.id}] ${parsedFile?.name}`);

    const attributesComponent = parsedFile?.modules?.map((module: Module) => {
      // return module?.name === "Attributes";

      return module.components.flatMap((component) => {
        const isAllowed = allowedComponents.includes(component.component_id);
        if (!isAllowed) {
          return [];
        }

        console.log(`[+] Looking at component: ${component.component_id}`);

        let returnComponent: any;

        if (component.component_id === "baseInfo" && !!component.data) {
          const dataParsed = JSON.parse(component.data);
          const formattedBiArray = dataParsed?.list?.map((item: any) => {
            const id = formatToId(item?.key)?.toLowerCase();
            const itemObject: {
              key: string;
              value: string | string[] | SameFactionAgent[];
            } = {
              key: cleanFromHTML(item.key),
              value: cleanFromHTML(item.value?.[0] || item.value),
            };

            // Replace value with agent's object
            if (isStringifiedObject(item?.value?.[0])) {
              itemObject.value = item.value.flatMap((agentContainer: any) => {
                agentContainer = replaceDollarSign(agentContainer);

                const parsedAgent = JSON.parse(agentContainer);

                return parsedAgent.map((agent: any) => {
                  return {
                    id: agent.ep_id,
                    type: agent.menuId?.toLowerCase(),
                    name: agent.name,
                    iconUrl: agent.icon,
                  };
                });
              });
            }

            // return [id, itemObject];
            return itemObject;
          });

          // returnComponent = Object.fromEntries(formattedBiArray);
          returnComponent = formattedBiArray;
        }

        if (component.component_id === "ascension") {
          const dataParsed = JSON.parse(component.data);

          const formattedBiArray = dataParsed?.list?.map((item: any) => {
            const id = formatToId(item?.key)?.toLowerCase();

            const stats = item.combatList
              .map((stat: any, index: number) => {
                if (index === 0) {
                  return null;
                }

                return {
                  // id: cleanFromHTML(formatToId(stat.key)?.toLowerCase()),
                  key: cleanFromHTML(stat.key),
                  value: cleanFromHTML(stat.values[1]),
                };
              })
              .filter((stat: any) => {
                return !!stat;
              });

            const materials = item.materials.flatMap(
              (materialContainer: any) => {
                materialContainer = replaceDollarSign(materialContainer);
                const parsedAgent = JSON.parse(materialContainer);

                return parsedAgent.map((material: any) => {
                  return {
                    id: parseInt(material.ep_id),
                    type: material.menuId?.toLowerCase(),
                    name: material.nickname,
                    amount: parseInt(material.amount),
                    iconUrl: material.img,
                  };
                });
              }
            );

            const itemObject: {
              level: number;
              stats: any[];
              materials: any[];
            } = {
              level: parseInt(cleanFromHTML(item.key)),
              stats,
              materials,
            };

            // return [id.toString(), itemObject];
            return itemObject;
          });

          // returnComponent = Object.fromEntries(formattedBiArray);
          returnComponent = formattedBiArray;
        }

        if (component.component_id === "talent") {
          const dataParsed = JSON.parse(component.data);

          const formattedBiArray = dataParsed?.list?.map((item: any) => {
            const stats = item.attributes.map((stat: any, index: number) => {
              return {
                key: cleanFromHTML(stat.key),
                values: stat.values,
              };
            });

            const materials = item?.materials?.flatMap(
              (materialContainer: any) => {
                materialContainer = replaceDollarSign(materialContainer);
                const parsedAgent = JSON.parse(materialContainer);

                return parsedAgent.map((material: any) => {
                  return {
                    id: parseInt(material.ep_id),
                    type: material.menuId?.toLowerCase(),
                    name: material.nickname,
                    amount: parseInt(material.amount),
                    iconUrl: material.img,
                  };
                });
              }
            );

            const itemObject: any = {
              title: cleanFromHTML(item.title),
              description: item.desc,
              iconUrl: item.icon_url,
              stats: stats || [],
              materials: materials || [],
            };

            return itemObject;
          });

          returnComponent = formattedBiArray;
        }

        if (component.component_id === "textual_research" && !!component.data) {
          const dataParsed = JSON.parse(component.data);

          const formattedBiArray = dataParsed?.list?.map((item: any) => {
            return {
              title: cleanFromHTML(item.title),
              description: item.desc,
            };
          });

          returnComponent = formattedBiArray;
        }

        return [formatToId(component.component_id), returnComponent];
      });
    });

    const extraValues = Object.values(parsedFile?.filter_values)
      ?.filter((item: any) => {
        return !!item?.key && item?.values?.length > 0;
      })
      ?.map((values: any, index) => {
        const id = values?.key?.key;
        const key = formatToId(values?.key?.text)?.toLowerCase();
        const keyValues = values.values?.[0] || values?.values;

        return [key, keyValues];
      });

    const dump: any = {
      id: parseInt(parsedFile.id)?.toString(),
      name: cleanFromHTML(parsedFile.name),
      description: cleanFromHTML(parsedFile.desc),
      iconUrl: parsedFile.icon_url,
      headerUrl: parsedFile?.header_img_url || null,
      ...Object.fromEntries(extraValues),
      ...Object.fromEntries(attributesComponent),
    };

    const originalFileName = readdirSync(
      `data/${wikiAppName}/${folderTree}/entries`
    )[fileIndex];

    mergedResults.push(dump);

    writeFileSync(
      `data/${wikiAppName}/${folderTree}/parsed/${originalFileName}`,
      JSON.stringify(dump),
      "utf8"
    );
    // break;
  }

  writeFileSync(
    `data/${wikiAppName}/${folderTree}/${folderTree}_merged.json`,
    JSON.stringify(mergedResults),
    "utf8"
  );
}

main();

interface SameFactionAgent {
  id: number | string;
  name: string;
  iconUrl: string;
}

interface Module {
  name: string;
  components: Component[];
}

interface Component {
  component_id: string;
  data: string;
}

type ComponentItem =
  | {
      id: number;
      type: "agent" | "xxx";
      name: string;
      iconUrl: string;
    }
  | {
      id: number;
      type: "enhancement";
      name: string;
      amount: number;
      iconUrl: string;
    };

interface Bangboo {
  id: number | string;
  name: string;
  description: string;
  iconUrl: string;
  baseInfo?: {
    rarity: { key: string; value: string }; // <- convert from array
    version_released: { key: string; value: string }; // <- convert from array
  };
  ascension?: Record<
    string,
    {
      level: string;
      stats: {
        id: string;
        key: string;
        value: number;
      }[];
      materials: ComponentItem[];
    }
  >;
}

// https://sg-public-api-static.hoyoverse.com/content_v2_user/app/3e9196a4b9274bd7/getContentList?iPageSize=100&iPage=1&iChanId=288&sLangKey=en-us

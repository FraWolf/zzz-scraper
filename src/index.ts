import { mkdirSync, writeFileSync } from "fs";
import { defaultHeaders, getSubMenuData, request } from "./utils";

const defaultDir = "./data";

async function main() {
  // Get all menu entries
  const menuRequest = await request<any>(
    "https://sg-wiki-api-static.hoyolab.com/hoyowiki/zzz/wapi/get_menus",
    {
      headers: defaultHeaders,
      json: true,
    }
  );

  if (!menuRequest) {
    console.error("Unable to get menus data");
    return;
  }

  const menus = menuRequest?.data?.menus;
  for (let entry of menus) {
    if (!entry?.sub_menus) {
      continue;
    }

    const formattedMenuName = entry.name?.toLowerCase()?.replace(/\s+/g, "_");
    const menuDirPath = `${defaultDir}/${formattedMenuName}`;

    // Create folder if it doesn't exists
    mkdirSync(menuDirPath, { recursive: true });

    // Goes through sub menus
    for (let subMenu of entry.sub_menus) {
      const formattedSubMenuName = subMenu?.name
        ?.toLowerCase()
        ?.replace(/\s+/g, "_");

      // Get all entries on the sub menu page
      var subMenuPage: number = 1;
      var total: number = -1;
      const subMenuDatas: any[] = [];

      do {
        const subMenuRequest = await getSubMenuData(subMenu?.id, subMenuPage);

        if (!subMenuRequest) {
          console.error(`Unable to get sub menu ${subMenu?.name} data`);
          continue;
        }

        // Set total
        if (total === -1) {
          total = parseInt(subMenuRequest.data.total);
        }

        subMenuDatas.push(...subMenuRequest.data.list);
        subMenuPage++;
      } while (subMenuDatas.length !== total && total >= 0);

      // Get single page from all the entries
      const allEntriesRequests = subMenuDatas.map((item: any) => {
        return request<any>(
          `https://sg-wiki-api-static.hoyolab.com/hoyowiki/zzz/wapi/entry_page?entry_page_id=${item?.entry_page_id}`,
          {
            headers: defaultHeaders,
            json: true,
          }
        );
      });

      writeFileSync(
        `${menuDirPath}/${formattedSubMenuName}.json`,
        JSON.stringify(subMenuDatas),
        "utf8"
      );

      mkdirSync(`${menuDirPath}/entries`, { recursive: true });

      // Save page entries
      const entriesPromies = await Promise.all(allEntriesRequests);
      for (let pageEntry of entriesPromies) {
        writeFileSync(
          `${menuDirPath}/entries/${formattedSubMenuName}_${pageEntry?.data?.page?.id}.json`,
          JSON.stringify(pageEntry?.data?.page),
          "utf8"
        );
      }

      console.log(`${subMenu?.name} saved`);
    }
  }

  writeFileSync("./data/menu.json", JSON.stringify(menuRequest), "utf8");
}

main();

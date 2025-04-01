import { mkdirSync, readdirSync, writeFileSync } from "fs";
import { defaultHeaders, request } from "./utils";

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
      const subMenuRequest = await request<any>(
        "https://sg-wiki-api.hoyolab.com/hoyowiki/zzz/wapi/get_entry_page_list",
        {
          method: "POST",
          headers: defaultHeaders,
          body: JSON.stringify({
            menu_id: subMenu?.id,
            page_num: 1,
            page_size: 50,
          }),
          json: true,
        }
      );

      if (!subMenuRequest) {
        console.error(`Unable to get sub menu ${subMenu?.name} data`);
        continue;
      }

      // Get single page from all the entries
      const allEntriesRequests = subMenuRequest?.data?.list.map((item: any) => {
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
        JSON.stringify(subMenuRequest?.data?.list),
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

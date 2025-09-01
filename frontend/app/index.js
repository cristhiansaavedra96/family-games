import { useEffect } from "react";
import { router } from "expo-router";
import { getUsername } from "../src/shared/utils";
import { useStorage } from "../src/shared/hooks";

export default function Home() {
  const { loadItem } = useStorage();

  useEffect(() => {
    (async () => {
      const username = await getUsername();
      if (!username) {
        router.replace("/login");
        return;
      }

      const name = await loadItem("profile:name");
      if (!name) router.replace("/profile");
      else router.replace("/gameSelect");
    })();
  }, []);
  return null;
}

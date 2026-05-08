import { useEffect, useState } from "react";
import { fetchThemes } from "../services/api";
import { Template } from "../types";
import { THEME_TEMPLATES } from "../constants/themes";

export function useThemes() {
  const [themes, setThemes] = useState<Template[]>(THEME_TEMPLATES);
  useEffect(() => {
    // 로컬 테마 정의를 단일 소스로 사용합니다.
    setThemes(THEME_TEMPLATES);
    fetchThemes().catch(() => undefined);
  }, []);
  return themes;
}

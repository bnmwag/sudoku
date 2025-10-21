import type { NextPage } from "next";
import { Sudoku } from "@/components/sudoku";

const indexPage: NextPage = () => {
  return (
    <main className="h-svh grid place-items-center">
      <Sudoku />
    </main>
  );
};

export default indexPage;

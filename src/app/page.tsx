import type { NextPage } from "next";
import { Sudoku } from "@/components/sudoku";

const IndexPage: NextPage = () => {
  return (
    <main className="grid min-h-svh place-items-center py-4">
      <Sudoku />
    </main>
  );
};

export default IndexPage;

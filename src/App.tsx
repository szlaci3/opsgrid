import { CasesPage } from "./features/cases/CasesPage";
import styles from "./app/App.module.css";

function App() {
  return (
    <div className={styles.shell}>
      <CasesPage />
    </div>
  );
}

export default App;

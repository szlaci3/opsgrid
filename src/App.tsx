import { CasesPage } from "./features/cases/CasesPage";
import styles from "./app/App.module.css";
import topLeft from './assets/topLeft.png';
import bottomLeft from './assets/bottomLeft.png';
import bottomRight from './assets/bottomRight.png';

function App() {
  return (
    <div className={styles.shell}>
      <div className={styles.decorLayer}>
        <img
          src={topLeft}
          className={styles.topLeft}
          alt=""
        />

        <img
          src={bottomLeft}
          className={styles.bottomLeft}
          alt=""
        />

        <img
          src={bottomRight}
          className={styles.bottomRight}
          alt=""
        />
      </div>

      <CasesPage />
    </div>
  );
}

export default App;

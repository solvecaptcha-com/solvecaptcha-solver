import styles from './DetectorTable.module.scss';

import { FC } from "react";
import { IDetector } from "../types/detector.type";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Button } from "@mui/material";

type DetectorTableType = {
  data: IDetector[];
  clearAll: () => void;
}

const columns: GridColDef[] = [
  {field: 'name', headerName: 'Type', minWidth: 160},
  {field: 'url', headerName: 'Website url', minWidth: 200, editable: true},
  {field: 'sitekey', headerName: 'Sitekey', minWidth: 200, editable: true},
  {field: 'params', headerName: 'JSON API v1', flex: 1, minWidth: 150, sortable: false, editable: true},
  {field: 'params_v2', headerName: 'JSON API v2', flex: 1, minWidth: 150, sortable: false, editable: true},
  {field: 'timestamp', headerName: 'Date', minWidth: 250},
];

const DetectorTable: FC<DetectorTableType> = ({data, clearAll}) => {
  return (
    <>
      <div className={styles.actions}>
        <Button variant="contained" onClick={() => clearAll()}>Clear all</Button>
      </div>

      <div style={{height: 400, width: '100%'}}>
        <DataGrid
          rows={data}
          columns={columns}
          getRowId={(row) => row.timestamp}
          getRowHeight={() => 'auto'}
          initialState={{
            pagination: {
              paginationModel: {page: 0, pageSize: 5},
            },
          }}
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      </div>
    </>
  );
};

export default DetectorTable;

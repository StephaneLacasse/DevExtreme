import {
  Component,
  JSXComponent,
  Fragment,
  ComponentBindings,
  Template,
  JSXTemplate,
} from '@devextreme-generator/declarations';
import { Row } from '../row';
import { DataCellTemplateProps, ViewCellData } from '../../types';
import {
  getKeyByGroup,
  getIsGroupedAllDayPanel,
} from '../../utils';
import { AllDayPanelTableBody } from './all_day_panel/table_body';
import { LayoutProps } from '../layout_props';
import { DateTableCellBase } from './cell';
import { combineClasses } from '../../../../../utils/combine_classes';

export interface CellTemplateProps extends ViewCellData {
  dataCellTemplate?: JSXTemplate<DataCellTemplateProps>;
}

export const viewFunction = ({
  props: {
    viewData,
    groupOrientation,
    dataCellTemplate,
    cellTemplate: Cell,
  },
  rowClasses,
}: DateTableBody): JSX.Element => (
  <Fragment>
    {viewData
      .groupedData.map(({ dateTable, allDayPanel, groupIndex }, index) => (
        <Fragment key={getKeyByGroup(groupIndex, groupOrientation)}>
          {getIsGroupedAllDayPanel(viewData, index) && (
            <AllDayPanelTableBody
              viewData={allDayPanel}
              dataCellTemplate={dataCellTemplate}
              isVerticalGroupOrientation
              leftVirtualCellWidth={viewData.leftVirtualCellWidth}
              rightVirtualCellWidth={viewData.rightVirtualCellWidth}
              leftVirtualCellCount={viewData.leftVirtualCellCount}
              rightVirtualCellCount={viewData.rightVirtualCellCount}
            />
          )}
          {dateTable.map((cellsRow) => (
            <Row
              className={rowClasses}
              key={cellsRow[0].key - viewData.leftVirtualCellCount}
              leftVirtualCellWidth={viewData.leftVirtualCellWidth}
              rightVirtualCellWidth={viewData.rightVirtualCellWidth}
              leftVirtualCellCount={viewData.leftVirtualCellCount}
              rightVirtualCellCount={viewData.rightVirtualCellCount}
            >
              {cellsRow.map(({
                startDate,
                endDate,
                groups,
                groupIndex: cellGroupIndex,
                index: cellIndex,
                isFirstGroupCell,
                isLastGroupCell,
                isSelected,
                isFocused,
                key,
                text,
                otherMonth,
                firstDayOfMonth,
                today,
              }: ViewCellData) => (
                <Cell
                  isFirstGroupCell={isFirstGroupCell}
                  isLastGroupCell={isLastGroupCell}
                  startDate={startDate}
                  endDate={endDate}
                  groups={groups}
                  groupIndex={cellGroupIndex}
                  index={cellIndex}
                  dataCellTemplate={dataCellTemplate}
                  key={key}
                  text={text}
                  today={today}
                  otherMonth={otherMonth}
                  firstDayOfMonth={firstDayOfMonth}
                  isSelected={isSelected}
                  isFocused={isFocused}
                />
              ))}
            </Row>
          ))}
        </Fragment>
      ))}
  </Fragment>
);

@ComponentBindings()
export class DateTableBodyProps extends LayoutProps {
  @Template() cellTemplate: JSXTemplate<CellTemplateProps> = DateTableCellBase;
}

@Component({
  defaultOptionRules: null,
  view: viewFunction,
})
export class DateTableBody extends JSXComponent<DateTableBodyProps, 'cellTemplate'>() {
  get rowClasses(): string {
    const { addVerticalSizesClassToRows } = this.props;

    return combineClasses({
      'dx-scheduler-date-table-row': true,
      'dx-scheduler-cell-sizes-vertical': addVerticalSizesClassToRows,
    });
  }
}

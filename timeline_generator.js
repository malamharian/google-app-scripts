var NUM_OF_RESOURCES_CELL_IDX = {
  "row": 0,
  "col": 1
};

var END_STRING = 'END';
var ROW_START = 3;
var TASK_COL_IDX = 0;
var ESTIMATION_COL_IDX = 2;
var SEQUENCE_COL_IDX = 3;
var DAY_START_COL_IDX = 4;

function generateTimeline() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var availableResources = data[NUM_OF_RESOURCES_CELL_IDX.row][NUM_OF_RESOURCES_CELL_IDX.col];

  var sequences = {};
  var all_sequence_nums = [];
  populateSequencesAndAllNums(data, sequences, all_sequence_nums);
  markCells(sheet, sequences, all_sequence_nums, availableResources);
}

function populateSequencesAndAllNums(data, sequences, all_sequence_nums) {
  for (var i = ROW_START; i < data.length; i++) {
    var task = data[i][TASK_COL_IDX];
    if (task == END_STRING) {
      break;
    }
    var estimation = data[i][ESTIMATION_COL_IDX];
    var sequenceNumber = data[i][SEQUENCE_COL_IDX];

    if (isEmpty(estimation) || isEmpty(sequenceNumber) || estimation <= 0) {
      continue;
    }

    if (sequences[sequenceNumber] == null) {
      sequences[sequenceNumber] = [];
      all_sequence_nums.push(sequenceNumber);
    }
    var sequenceEntry = {
      "size": estimation,
      "row_idx": i
    };

    sequences[sequenceNumber].push(sequenceEntry);
  }

  all_sequence_nums.sort(function(a,b) { return a - b;});
}

function markCells(sheet, sequences, all_sequence_nums, RESOURCES_AVAILABLE) {
  var current_day_offset = 0;
  var available_resources = RESOURCES_AVAILABLE;
  var resources_freed_col_idxs = [];

  all_sequence_nums.forEach(sequence_num => {
    var max_size = 0;
    
    sequences[sequence_num].forEach(sequence => {
      
      var row = sequence.row_idx + 1;
      var size = sequence.size;

      var col_idx_start = DAY_START_COL_IDX + current_day_offset;
      var shifted_due_to_unavailability = 0;
      if (available_resources <= 0) {
        var resource_free_col_idx = resources_freed_col_idxs.shift();
        if (resource_free_col_idx > col_idx_start) {
          shifted_due_to_unavailability = resource_free_col_idx - col_idx_start;
          col_idx_start = resource_free_col_idx;
        }
        available_resources++;
      }

      var col_idx_end = col_idx_start + size;
      max_size = Math.max(max_size, shifted_due_to_unavailability + size);
      
      available_resources--;
      
      resources_freed_col_idxs.push(col_idx_end);
      resources_freed_col_idxs.sort(function(a,b) { return a - b;});

      var start_column_name = getColumnName(col_idx_start + 1);
      var end_column_name = getColumnName(col_idx_end);
      var cell_range_string = `${start_column_name}${row}:${end_column_name}${row}`;

      var cells = sheet.getRange(cell_range_string);
      cells.setBackground('green');
      cells.setBorder(true, true, true, true, false, false);
    });

    current_day_offset += max_size;
  });
}

var column_name_cache = {};

function getColumnName(column_index) {
  if (column_name_cache[column_index] != null) {
    return column_name_cache[column_index];
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const column = sheet.getRange(1, column_index, 1, 1);
  var column_name = column.getA1Notation().replace(/\d+/g, '');
  return column_name_cache[column_index] = column_name;
}

function isEmpty(value) {
  return value === "" || value === undefined || value === null;
}


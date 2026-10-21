// Approved Day 7 groups become four complete tasks through merge-approved-tasks.
// Preserve original IDs, keys, exchanges and variations for saved-record migration.
const clone = value => JSON.parse(JSON.stringify(value));

module.exports = function applyApprovedDay7(tasks) {
  const result = clone(tasks);
  const groups = [
    {
      id: 'day7-item-size-color',
      name: '找商品、詢問與回答尺寸顏色',
      description: '把進店找商品、主動詢問尺寸顏色及回答店員整合為同一任務；不同問法從各自的中文起點開始練。',
      members: [['find-item-size', 'A'], ['other-size-color', 'B'], ['answer-size-color', 'C']]
    },
    {
      id: 'day7-try-fitting-room',
      name: '問試穿與試衣間',
      description: '選好衣服後，詢問可否試穿及試衣間位置。',
      members: [['try-fitting-room', 'D']]
    },
    {
      id: 'day7-size-and-fit',
      name: '換尺寸、接受建議與說明合身',
      description: '把換大、換小及接受店員建議後說合身整合為同一任務；每段試穿有各自的衣服與起點。',
      members: [['too-small-bigger', 'E'], ['too-big-smaller', 'F'], ['accept-size-fit', 'G']]
    },
    {
      id: 'day7-compare-buy',
      name: '比較喜好，決定購買',
      description: '比較兩件合身的上衣，說出偏好並決定購買。',
      members: [['compare-buy', 'H']]
    }
  ];
  const byKey = new Map(result.map(task => [task.key, task]));
  groups.forEach((group, order) => {
    group.members.forEach(([key, id], position) => {
      const task = byKey.get(key);
      if (!task) throw Error('Missing original Day 7 task: ' + key);
      task.id = id;
      task.chapter = {
        id: group.id,
        name: group.name,
        order: order + 1,
        description: group.description,
        position
      };
    });
  });
  return result;
};

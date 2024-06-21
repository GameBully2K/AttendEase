/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
var mergeTwoLists = function(list1, list2) {
    for (let i= 0; i < list2.length; i++) {
        list1.push(list2[i])
    }
    list1.sort((a, b) => a - b)
    return list1
};

console.log(mergeTwoLists([1,2,4], [1,3,4])) // [1,1,2,3,4,4]

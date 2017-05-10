package com.zealot.bean;

import java.awt.Color;
import java.awt.Graphics;
import java.util.ArrayDeque;
import java.util.Deque;

import com.zealot.ui.MainWindow;

public class Snake {
	public enum Direction{
		UP, DOWN, LEFT, RIGHT
	}
	private Deque<SnakeNode> snakeHead;
	private Color color;//颜色
	private int initRowPos = 25;//初始行位置
	private int initColPos = 25;//初始列位置
	private int minRow;//可以爬行的边界
	private int minCol;
	private int maxRow;
	private int maxCol;
	private Direction direction = Direction.LEFT;//开始游戏时向左
	private double currScore = 0;//当前得分
	//默认初始蛇的长度为2
	public Snake(){
		this(2, Color.green);
	}
	public Snake(int nodeNum){
		this(nodeNum, Color.green);
	}
	public Snake(Color color){
		this(2, color);
	}
	public Snake(int nodeNum, Color color){
		//开始游戏时蛇头朝左
		snakeHead = new ArrayDeque<SnakeNode>(50);
		for(int i=0; i<nodeNum; i++){
			snakeHead.addLast(new SnakeNode(initRowPos, initColPos+i));
			MainWindow.GameMap.isPossessed[initRowPos][initColPos+i] = 1;
		}
		this.color = color;
	}
	
	public void setMovingBoundary(int maxRow, int minRow, int maxCol, int minCol){
		this.maxRow = maxRow;
		this.minRow = minRow;
		this.maxCol = maxCol;
		this.minCol = minCol;
	}
	public Color getColor(){
		return color;
	}
	public void setDirection(Direction direction){
		this.direction = direction;
	}
	public Direction getDirection() {
		return direction;
	}
	public double getCurrScore() {
		return this.currScore;
	}
	public Deque<SnakeNode> getSnakeHead() {
		return snakeHead;
	}
	//身体变长，增长的一个结点的坐标可以随便写，反正之后马上要移动到头部了
	public void addNode(){
		snakeHead.addLast(new SnakeNode(0, 0));
	}
	//改变方向
	public void turnUp(){
		direction = Direction.UP;
	}
	public void turnDown(){
		direction = Direction.DOWN;
	}
	public void turnLeft(){
		direction = Direction.LEFT;
	}
	public void turnRight(){
		direction = Direction.RIGHT;
	}
	//吃掉一个果实，增长一结，加分，返回尾结点（实际意义是新的头结点）
	private SnakeNode eatFruit(int rowPos, int colPos){
		addNode();
		MainWindow.GameMap.fruits.removeOne(rowPos, colPos);
		this.currScore += Fruits.BONUS;
		return snakeHead.getLast();
	}
	//爬行
	public boolean move(){
		SnakeNode oldHead = snakeHead.getFirst(),
				  newHead = snakeHead.getLast();
		MainWindow.GameMap.isPossessed[newHead.rowPos][newHead.colPos] = 0;
		boolean flag = true;
		switch(direction){
		case UP:		//碰到边界了 或者 碰到自己身体了则游戏结束
			if(oldHead.rowPos <= minRow || MainWindow.GameMap.isPossessed[oldHead.rowPos-1][oldHead.colPos]==1)
				flag = false;
			else{
				//如果碰到果实了
				if(MainWindow.GameMap.isPossessed[oldHead.rowPos-1][oldHead.colPos]==2)
					newHead = eatFruit(oldHead.rowPos-1, oldHead.colPos);
				tailFollow();
				newHead.rowPos = oldHead.rowPos - 1;
				newHead.colPos = oldHead.colPos;
				MainWindow.GameMap.isPossessed[newHead.rowPos][newHead.colPos] = 1; 
			}
			break;
		case DOWN:
			if(oldHead.rowPos >= maxRow || MainWindow.GameMap.isPossessed[oldHead.rowPos+1][oldHead.colPos]==1)
				flag = false;
			else{
				if(MainWindow.GameMap.isPossessed[oldHead.rowPos+1][oldHead.colPos]==2)
					newHead = eatFruit(oldHead.rowPos+1, oldHead.colPos);
				tailFollow();
				newHead.rowPos = oldHead.rowPos + 1;
				newHead.colPos = oldHead.colPos;
				MainWindow.GameMap.isPossessed[newHead.rowPos][newHead.colPos] = 1;
			}
			break;
		case LEFT:
			if(oldHead.colPos <= minCol || MainWindow.GameMap.isPossessed[oldHead.rowPos][oldHead.colPos-1]==1)
				flag = false;
			else{
				if(MainWindow.GameMap.isPossessed[oldHead.rowPos][oldHead.colPos-1]==2)
					newHead = eatFruit(oldHead.rowPos, oldHead.colPos-1);
				tailFollow();
				newHead.colPos = oldHead.colPos - 1;
				newHead.rowPos = oldHead.rowPos;
				MainWindow.GameMap.isPossessed[newHead.rowPos][newHead.colPos] = 1;
			}
			break;
		case RIGHT:
			if(oldHead.colPos >= maxCol || MainWindow.GameMap.isPossessed[oldHead.rowPos][oldHead.colPos+1]==1)
				flag = false;
			else{
				if(MainWindow.GameMap.isPossessed[oldHead.rowPos][oldHead.colPos+1]==2)
					newHead = eatFruit(oldHead.rowPos, oldHead.colPos+1);
				tailFollow();
				newHead.colPos = oldHead.colPos + 1;
				newHead.rowPos = oldHead.rowPos;
				MainWindow.GameMap.isPossessed[newHead.rowPos][newHead.colPos] = 1;
			}
			break;
		default: 
			break;
		}
		return flag;
	}
	//把尾巴放到头前面
	private void tailFollow(){
		snakeHead.addFirst(snakeHead.pollLast());
	}
	private class SnakeNode {
		int rowPos;//结点所在行
		int colPos;//结点所在列
		SnakeNode(int row, int col){
			this.rowPos = row;
			this.colPos = col;
		}
	}
	public void drawSnake(Graphics g, int x, int y, int gridSize) {
		g.setColor(color);
		for(SnakeNode node : snakeHead){
			g.fillRoundRect(x+gridSize*(node.colPos-1), y+gridSize*(node.rowPos-1), gridSize, gridSize, 5, 5);
		}
		
	}
	
}

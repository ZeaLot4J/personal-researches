package com.zealot.bean;

import java.awt.Color;
import java.awt.Graphics;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Random;
import java.util.Set;

import com.zealot.ui.MainWindow;

/**
 * 果实
 * 
 * @author ZeaLot
 *
 */
public class Fruits {
	private Set<Fruit> fruitSet = new HashSet<Fruit>();
	private Color color;
	private Color auxColor = Color.BLUE;
	public static double BONUS = 5.0;//一个5分
	private Random rd = new Random();
	public Fruits(){
		this(Color.RED);
	}
	public Fruits(Color color){
		this.color = color;
	}
	public void addOne() {
		Fruit f = null;
		do{
			f = new Fruit();
			//如果果实出现在蛇身上或者是果实上，则重新产生果实
		}while(MainWindow.GameMap.isPossessed[f.rowPos][f.colPos] != 0);
		this.fruitSet.add(f);
		MainWindow.GameMap.isPossessed[f.rowPos][f.colPos] = 2;
	}

	public void removeOne(int rowPos, int colPos) {
		Iterator<Fruit> iter = fruitSet.iterator();
		while(iter.hasNext()){
			Fruit f = iter.next();
			if(f.rowPos==rowPos && f.colPos==colPos){
				iter.remove();
				break;
			}			
		}
	}

	public void drawFruit(Graphics g, int x, int y, int gridSize) {
		g.setColor(new Color(rd.nextInt(256), rd.nextInt(256), rd.nextInt(256)));
		for(Fruit f:fruitSet)
			g.fillOval(x + gridSize * (f.colPos - 1), y + gridSize * (f.rowPos - 1), gridSize, gridSize);
	}

	private class Fruit {
		int rowPos;
		int colPos;

		Fruit() {
			this(50);
		}

		// 根据坐标范围随机生成行列坐标
		Fruit(int range) {
			this.rowPos = rd.nextInt(range) + 1;
			this.colPos = rd.nextInt(range) + 1;
		}
	}
}

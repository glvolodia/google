class StaticPagesController < ApplicationController

  def welcome
    @title = " Welcome to my SITE !!! "
  end

  def about
    @title = " Ми навчаємо людей програмуванню... "
  end

  def contact
    @title = " Ukraine, 79000 Lviv "
  end

end

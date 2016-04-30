class Page < ActiveRecord::Base

  validates :name, :description, presence: true
  
end

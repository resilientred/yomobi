class Widgets::LeaveMsgController < ApplicationController
  
  def submit
    error('bad message') if (params[:msg_content] || '').empty?

    # TODO: remove this line
    return if Rails.env == 'production'
    
    UserMailer.leave_msg({
      :to => 'yomobi@mailinator.com',
      :subject => 'You received customer feedback!',
      :from => 'feedback@yomobi.com',
      :feedback => params[:msg_content]
    }).deliver
    success :msg => params[:msg_content]
  end
end
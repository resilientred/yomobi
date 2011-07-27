class UserMailer < ActionMailer::Base
  default :from => "message@yomobi.com"

  def leave_msg(params)
    @params = params
    mail params
  end

  def call_back(params)
    @params = params
    mail params
  end

  def tell_friend(params)
    @params = params
    mail params
  end

  def send_text(params)
    follower = params[:follower]
    @content = params[:content]
    @short_url = follower.short_url
    mail({
      :to => "#{follower.phone}@#{follower.carrier.text_email}",
      :from => 'message@yomobi.com',
      :reply_to => params[:company].informed_email || params[:company].user.email
    })
  end

  def email_follower(params)
    @params = params
    mail params
  end

  def booking_email(params)
    @params = params
    mail params
  end
end

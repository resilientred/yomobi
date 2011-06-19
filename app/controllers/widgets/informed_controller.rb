class Widgets::InformedController < ApplicationController
  layout "builder"
  before_filter :authenticate_user!, :only => [:text_panel,:email_panel,:send_text]

  def mobile_submit
    return error('bad message') unless follower_data_present? params
    return error('captcha') unless verify_recaptcha

    company = Company.find_by_name params[:company]
    carrier = Carrier.find_by_name params[:carrier]

    return error('bad company') if company.nil?

    follower, isNew = find_or_build_follower company, params[:email], params[:phone], carrier

    save_success = isNew ? follower.save_new : follower.save
    save_success ? success(nil) : error(follower.errors)
    puts "ERRORS: #{follower.errors.inspect}\nFOLLOWER: #{follower.inspect}"
  end

  def text_panel
    @user = current_user
    @company = @user.company
    @max_chars = max_message_length
    @errors = {}
  end

  def send_text
    @company = current_user.company
    @errors = {}

    if @company.informed_email.nil?
      @errors[:message] = "Your 'Keep Me Informed' widget does not have a valid email"
      @old_message = params[:message]
    elsif valid_text_message? params[:message]
      @company.text_followers.each {|f| f.send_text params[:message]}
      flash.now[:notice] = 'Texts successfully sent'
    else
      @errors[:message] = "Message length is too long (must be less than #{max_message_length} characters long)"
      @old_message = params[:message]
    end

    return render 'text_panel'
  end

  def email_panel
    @user = current_user
    @company = @user.company
    @max_chars = max_message_length
    @errors = {}
  end

  def send_email
    @company = current_user.company
    @errors = {}

    if @company.informed_email.nil?
      @errors[:no_email] = "Your 'Keep Me Informed' widget does not have a valid email"
      @old_subject = params[:subject]
      @old_content = params[:content]
    else
      @company.email_followers.each {|f| f.send_email params[:subject], params[:content]}
      flash.now[:notice] = "Email successfully sent."
    end

    return render 'email_panel'
  end

  def opt_out
    follower = Follower.find_by_opt_out_key params[:key]
    return redirect_to root_path if follower.nil?

    @company_name = follower.company.name
    @company_url = follower.company.db_name
    follower.active = false
    follower.save

    @opt_in_url = "#{Rails.application.config.opt_out_url_host}/#{@company_url}#page/keep-me-informed"
    render :layout => 'mobile_basic'
  end

  private

  def follower_data_present? data
    data['email'].present? ||
    data['phone'].present? && data['carrier'].present?
  end

  def valid_text_message?(msg)
    msg.size < max_message_length
  end

  def max_message_length
    140 - (" To Unsubscribe: ".length + SHORT_URL_RESERVED_COUNT)
  end

  def find_or_build_follower(company,email,phone,carrier)
    follower = Follower.where(:email => email, :phone => phone && phone.gsub!(/[^0-9]+/,'')).first
    if follower && follower.active == false
      follower.active = true
      return [follower,false]
    end

    follower = company.followers.build \
      :carrier => carrier,
      :email   => email,
      :phone   => phone
    return [follower,true]
  end
end

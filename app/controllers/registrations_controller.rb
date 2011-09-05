class RegistrationsController < Devise::RegistrationsController

  def new
    @hide_signup_bar = true
    super
  end

  def create
    @hide_header_signin_form = true
    @hide_captcha = false
    @hide_signup_bar = true
    if verify_recaptcha
      super
    else
      build_resource
      clean_up_passwords(resource)
      flash[:alert] = "There was an error with the recaptcha code below. Please re-enter the code and click submit."
      render_with_scope :new
    end
  end
  
  protected
  
  def after_sign_up_path_for(resource)
    account_setup_path 1
  end
  
  def after_inactive_sign_up_path_for(resource)
    account_setup_path 1
  end
end
